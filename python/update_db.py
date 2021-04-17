#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
import getpass
import mwparserfromhell
import requests
import sys
import time
from datetime import timezone, timedelta, datetime
import logging
from typing import List, Dict

from stjj_aic.parse_wikitext import parse_wikitext, format_carddata, ParseError
from stjj_aic.getpostrequest import GetPostRequest
from stjj_aic.carddata import CardData, ConvertError


class GetCardDataFromFandom:
    @staticmethod
    def getCardData(gpreq : GetPostRequest) -> dict:
        #テストページのidの配列
        #Test PageかつCard Pageを持つページのid
        #241: テンプレート:Cardtable
        #238: TEST 1（カードテンプレートページ）
        #246: Test2（カードページ見本）
        #7016: TEST 3（空白のカードテンプレートページ）
        testpageids = ['241', '238', '246', '7016']

        #fandom_carddata = {pageid: {"pageid": pageid, "lastrevid": lastrevid}, ...}
        fandom_carddata = {}
        continue_query = ""
        is_continuance = True

        #データをすべて取得できるまで
        while is_continuance:
            #カテゴリ:Card Pageに属するページのidを得る。
            QUERY = {
                "action" : "query",
                "generator": "categorymembers",
                "gcmtitle" : "カテゴリ:Card Page",
                "prop": "info",
                "gcmlimit": "500",
                "gcmcontinue": continue_query,
                "format": "json"
            }
            cardpages = gpreq.postRequest(QUERY).json()
            #カテゴリ:Card Pageに属するページのidと最新のrevidを得て辞書に保存する
            cardpages_id = cardpages["query"]["pages"]
            for cardid in cardpages_id:
                #Test Pageのidでないなら
                if cardid not in testpageids:
                    fandom_carddata[cardpages_id[cardid]["pageid"]] = {'pageid': cardpages_id[cardid]["pageid"], 'lastrevid': cardpages_id[cardid]["lastrevid"]}

            #取得できていないデータを続けて取得する
            is_continuance = "continue" in cardpages
            if is_continuance:
                continue_query = cardpages["continue"]["gcmcontinue"]
        return fandom_carddata

class ActionCardData:
    
    @staticmethod
    def Upsert(carddata: dict, verify = True):
        req = requests.Session()
        headers = {"content-type": "application/json"}
        response = req.post(url = "http://localhost:55000/upsert", data = json.dumps(carddata, ensure_ascii=False).encode("utf-8"), headers = headers,  verify = verify)
        return response


    @staticmethod
    def Delete(cardids: [int], verify = True):
        req = requests.Session()
        print(cardids)
        data = {"deleteTargetCardPageids": cardids}
        print(data)
        headers = {"content-type": "application/json"}
        response = req.post(url = "http://localhost:55000/bulk_delete", data = json.dumps(data, ensure_ascii = False).encode("utf-8"), headers = headers,  verify = verify)

        return response

    @staticmethod
    #DBからカードデータを得る
    def getdb_carddata(verify = True):
        req = requests.Session()
        headers = {"content-type": "application/json"}
        response = req.get(url = "http://localhost:55000/current_cards" ,headers = headers, verify = verify)
        return response


#fandom_carddata = {pageid: {"pageid": pageid, "lastrevid": lastrevid}, ...}
#db_carddata = [{"pageid": pageid, "lastrevid" : lastrevid}, ...]
#FANDOMで新規登録されたカードまたは更新されたカードのidを追加し配列として返す
def add_upsertids(db_carddata : List[Dict[str,int]], fandom_carddata : Dict[int, Dict[str, int]]) -> List[int]:
    upsert_ids = []

    for fandomid in fandom_carddata:
        f = False
        for dbid in db_carddata:
            if dbid["pageid"] == fandomid:
                f = True
                if fandom_carddata[fandomid]["lastrevid"] != dbid["lastrevid"]:
                    upsert_ids.append(fandomid)
                    break
        if not f:
            upsert_ids.append(fandomid)

    return upsert_ids
        

#FANDOMから削除されたカードのidを追加し配列として返す
def add_deleteids(db_carddata : List[Dict[str,int]], fandom_carddata : Dict[int, Dict[str, int]]) -> List[int]:
    delete_ids = []

    for dbid in db_carddata:
        f = False
        for fandomid in fandom_carddata:
            if dbid["pageid"] == fandomid:
                f = True
        if not f:
            delete_ids.append(int(dbid["pageid"]))
    
    return delete_ids





def main():
    JST = timezone(timedelta(hours =+9), "JST")
    now = datetime.now(JST)

    formatter = '%(levelname)s : %(message)s'

    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    handler = logging.FileHandler(filename = "/home/stjj-aic/log/server.log-" + now.strftime("%Y-%m-%d"), encoding='utf-8')
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter(formatter))
    logger.addHandler(handler)

    logger.info("Start...")

    gpreq = GetPostRequest("https://scptcgjpj.fandom.com/ja/api.php")

    ###カードのデータを得てDBに保存する###
    try:
        fandom_carddata = GetCardDataFromFandom.getCardData(gpreq)
        logger.debug("{} : Get Cards from Fandom : OK".format(now.strftime('%Y-%m-%d %H:%M:%S')))
    except requests.exceptions.ConnectionError as e:
        logger.error("{} : Get Cards from Fandom : {} : NG".format(now.strftime('%Y-%m-%d %H:%M:%S'), e))
        sys.exit(1)
    ###DBのカードデータ取得
    try:
        db_carddata = ActionCardData.getdb_carddata(False).json()
        logger.debug("{} : Get Cards from DB : OK".format(now.strftime('%Y-%m-%d %H:%M:%S')))
    except requests.exceptions.ConnectionError as e:
        logger.error("{} : Get Cards from DB : {} : NG".format(now.strftime('%Y-%m-%d %H:%M:%S'), e))
        sys.exit(1)


    #更新・追加対象のカード及び削除対象のカードのidを記録する
    upsert_ids = add_upsertids(db_carddata, fandom_carddata)
    delete_ids = add_deleteids(db_carddata, fandom_carddata)

    ###更新または追加カードのidからそのページのwikitextを得、実際に更新または追加する
    for id in upsert_ids:
        #wikitextの取得
        WIKITEXT_QUERY = {
            "action": "parse",
            "pageid": id,
            "prop": "wikitext",
            "format": "json"
        }
        R = gpreq.postRequest(WIKITEXT_QUERY)
        wikitext = R.json()["parse"]["wikitext"]["*"]
        try:
            cardprops = format_carddata(parse_wikitext(wikitext), id, fandom_carddata[id]["lastrevid"], R.json()["parse"]["title"]).getCardDataDict()
        except (ConvertError, ParseError) as e:
            logger.error("{} : Parse Wikitext : {} : {} : NG".format(now.strftime('%Y-%m-%d %H:%M:%S'), wikitext, e))
            sys.exit(1)
        try:
            response = ActionCardData.Upsert(cardprops)
            if response.status_code == requests.codes.ok:
                logger.debug("{} : Upsert Card To DB : {} : OK".format(now.strftime('%Y-%m-%d %H:%M:%S'), json.dumps(cardprops, ensure_ascii=False)))
            elif response.status_code == 422:
                logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Upsert Card To DB' + ' : ' + json.dumps(cardprops, ensure_ascii=False) + ' : ' + json.dumps(response.json()['errors'], ensure_ascii=False) + ' : '+ 'NG' )) 
                sys.exit(1)
            else:
                logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Upsert Card To DB' + ' : ' + json.dumps(cardprops, ensure_ascii=False) + ' : ' +'StatusCode=' + str(response.status_code) + ' : '+ 'NG' )) 
                sys.exit(1)
        except requests.exceptions.ConnectionError as e:
            logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Upsert Card To DB' + ' : ' + json.dumps(cardprops, ensure_ascii=False) + ' : ' + 'ConnectionError' + ' : '+ 'NG'))
            print(e)
            sys.exit(1)

    #カードを削除する
    if delete_ids:
        try:
            response = ActionCardData.Delete(delete_ids)
            if response.status_code == requests.codes.ok:
                logger.debug("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Delete Cards From DB' + ' : ' + ','.join(map(str, delete_ids)) + ' : ' + 'OK')) 
            elif response.status_code == 422:
                logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Delete Cards From DB' + ' : ' + ','.join(map(str, delete_ids)) + ' : ' + json.dumps(response.json()['errors'], ensure_ascii=False) + ' : '+ 'NG' ))
                sys.exit(1)
            else:
                logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Delete Cards From DB' + ' : ' + ','.join(map(str, delete_ids)) + ' : ' + 'StatusCode=' + str(response.status_code) + ' : '+ 'NG' ))
                sys.exit(1)
        except requests.exceptions.ConnectionError as e:
            logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Delete Cards From DB' + ' : ' +  ','.join(map(str, delete_ids)) + ' : ' + 'ConnectionError' + ' : '+ 'NG'))
            print(e)
    
    logger.info("End...")

if __name__ == "__main__":
    main()

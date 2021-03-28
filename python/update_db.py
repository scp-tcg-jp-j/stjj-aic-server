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

        #cardid_list = {pageid: {"pageid": pageid, "lastrevid": lastrevid}, ...}
        cardid_list = {}
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
                    cardid_list[cardpages_id[cardid]["pageid"]] = {'pageid': cardpages_id[cardid]["pageid"], 'lastrevid': cardpages_id[cardid]["lastrevid"]}

            #取得できていないデータを続けて取得する
            is_continuance = "continue" in cardpages
            if is_continuance:
                continue_query = cardpages["continue"]["gcmcontinue"]
        return cardid_list

class ActionCardData:
    
    @staticmethod
    def UpdateOrAdd(url : str, carddata: dict, verify = True):
        req = requests.Session()
        headers = {"content-type": "application/json"}
        response = req.post(url = url, data = json.dumps(carddata, ensure_ascii=False).encode("utf-8"), headers = headers,  verify = verify)
        return response


    @staticmethod
    def Delete(url : str, cardids: [int], verify = True):
        req = requests.Session()
        print(cardids)
        data = {"deleteTargetCardPageids": cardids}
        print(data)
        headers = {"content-type": "application/json"}
        response = req.post(url = url, data = json.dumps(data, ensure_ascii = False).encode("utf-8"), headers = headers,  verify = verify)

        return response

    @staticmethod
    def getDBCardData(url : str, verify = True):
        req = requests.Session()
        headers = {"content-type": "application/json"}
        response = req.get(url = url,headers = headers, verify = verify)
        return response


#テスト用データの生成
def generate_dbcardidlist():
    data = [
    {
        "pageid": 1 ,
        "last_revid": 1
    },
    {
        "pageid": 2 ,
        "last_revid": 1
    },
    {
        "pageid": 3 , 
        "last_revid": 1
    },
    ]

    return data

#テスト用fandomカードデータ
#cardid_list = {pageid: {"pageid": pageid, "lastrevid": lastrevid}, ...}
def generate_fandomcardidlist():
    data = {1: {"pageid" : 1, "lastrevid": 1}, 3: {"pageid" : 3, "lastrevid": 2},  5: {"pageid" : 5, "lastrevid": 1}}
    return data


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
        cardid_list = GetCardDataFromFandom.getCardData(gpreq)
        logger.debug("{} : Get Cards from Fandom : OK".format(now.strftime('%Y-%m-%d %H:%M:%S')))
    except requests.exceptions.ConnectionError as e:
        logger.error("{} : Get Cards from Fandom : {} : NG".format(now.strftime('%Y-%m-%d %H:%M:%S'), e))
        sys.exit(1)
    ###DBのカードデータ取得
    try:
        dbcarddata = ActionCardData.getDBCardData("http://localhost:55000/current_cards", False).json()
        logger.debug("{} : Get Cards from DB : OK".format(now.strftime('%Y-%m-%d %H:%M:%S')))
    except requests.exceptions.ConnectionError as e:
        logger.error("{} : Get Cards from DB : {} : NG".format(now.strftime('%Y-%m-%d %H:%M:%S'), e))
        sys.exit(1)


    #更新・追加対象のカード及び削除対象のカードのidを記録する
    update_or_add_ids = []
    delete_ids = []

    for fandomid in cardid_list:
        f = False
        for dbid in dbcarddata:
            if dbid["pageid"] == fandomid:
                f = True
                if cardid_list[fandomid]["lastrevid"] != dbid["latest_revid"]:
                    update_or_add_ids.append(fandomid)
                    break
        if not f:
            update_or_add_ids.append(fandomid)

    for dbid in dbcarddata:
        f = False
        for fandomid in cardid_list:
            if dbid["pageid"] == fandomid:
                f = True
        if not f:
            delete_ids.append(int(dbid["pageid"]))

    #print(update_or_add_ids)
    #print(delete_ids)


    ###更新または追加カードのidからそのページのwikitextを得、実際に更新または追加する
    for id in update_or_add_ids:
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
            cardprops = format_carddata(parse_wikitext(wikitext), id, cardid_list[id]["lastrevid"], R.json()["parse"]["title"]).getCardDataDict()
        except (ConvertError, ParseError) as e:
            logger.error("{} : Parse Wikitext : {} : {} : NG".format(now.strftime('%Y-%m-%d %H:%M:%S'), wikitext, e))
            sys.exit(1)
        try:
            response = ActionCardData.UpdateOrAdd("http://localhost:55000/upsert", cardprops)
            if response.status_code == requests.codes.ok:
                logger.debug("{} : Upsert Card To DB : {} : OK".format(now.strftime('%Y-%m-%d %H:%M:%S'), json.dumps(cardprops, ensure_ascii=False)))
            elif response.status_code == 422:
                logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Upsert Card To DB' + ' : ' + json.dumps(cardprops, ensure_ascii=False) + ' : ' + json.dumps(response.json()['error'], ensure_ascii=False) + ' : '+ 'NG' )) 
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
            response = ActionCardData.Delete("http://localhost:55000/bulk_delete", delete_ids)
            if response.status_code == requests.codes.ok:
                logger.debug("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Delete Cards From DB' + ' : ' + ','.join(map(str, delete_ids)) + ' : ' + 'OK')) 
            elif response.status_code == 422:
                logger.error("{}".format(now.strftime('%Y-%m-%d %H:%M:%S') + ' : ' + 'Delete Cards From DB' + ' : ' + ','.join(map(str, delete_ids)) + ' : ' + json.dumps(response.json()['error'], ensure_ascii=False) + ' : '+ 'NG' ))
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

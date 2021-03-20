#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
import getpass
import mwparserfromhell
import requests
import sys

from stjj_aic.parse_wikitext import parse_wikitext
from stjj_aic.getpostrequest import GetPostRequest


class GetCardDataFromFandom:
    @staticmethod
    def getCardData(gpreq : GetPostRequest) -> dict:
        #テストページのidの配列
        #Test PageかつCard Pageを持つページのid
        #241: テンプレート:Cardtable
        #238: TEST 1（カードテンプレートページ）
        #246: Test2（カードページ見本）
        testpageids = ['241', '238', '246']

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
        response = req.post(url = url, data = json.dumps(carddata), verify = verify)
        return response


    @staticmethod
    def Delete(url : str, cardids: [int], verify = True):
        req = requests.Session()
        data = {"deleteTargetCardPageids": cardids}
        response = req.post(url = url, data = json.dumps(data), verify = verify)
        return response

    @staticmethod
    def getDBCardData(url : str, verify = True):
        req = requests.Session()
        response = req.get(url = url, verify = verify)
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

    gpreq = GetPostRequest("https://scptcgjpj.fandom.com/ja/api.php")

    ###カードのデータを得てDBに保存する###
    print("カードidの取得中")
    #cardid_list = GetCardDataFromFandom.getCardData(gpreq)
    cardid_list = generate_fandomcardidlist()

    ###DBのカードデータ取得
    try: 
        dbcarddata = ActionCardData.getDBCardData("http://localhost:55000/current_cards", False)
    except requests.exceptions.ConnectionError as e:
        print(e)
        sys.exit(1)
    dbcarddata = generate_dbcardidlist()

    update_or_add_ids = []
    delete_ids = []

    for fandomid in cardid_list:
        f = False
        for dbid in dbcarddata:
            if dbid["pageid"] == fandomid:
                f = True
                if cardid_list[fandomid]["lastrevid"] != dbid["last_revid"]:
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
            delete_ids.append(dbid["pageid"])

    print(update_or_add_ids)
    print(delete_ids)
    sys.exit(0) #ここまで


    print("wikitextの取得中")


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

        cardprops = parse_wikitext(wikitext, id, vardid_list)
        
        response = ActionCardData.UpdateOrAdd("http://localhost:55000/upsert", cardprops)


    #カードを削除する
    response = ActionCardData.Delete("http://localhost:55000/bulk_delete", delete_ids)


if __name__ == "__main__":
    main()
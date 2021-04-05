#!/usr/bin/python3
import json
import mwparserfromhell
import re

from .carddata import CardData

class ParseError(Exception):
    pass

'''
{{Cardtable
    |card_type    = String
    |sub_type     = String 
    |type         = String
    |number       = Number
    |name         = String
    |image        = String
    |object_class = String
    |attack       = Number
    |cost         = Number
    |effect_text  = String
    |flavor_text  = String
    |tags         = String
    |limited      = String
    |effect_tags  = String
    |source       = String
    |remark       = String
}}
'''


'''
返り値
    {
    'sub_type'      : 'value1'
    ,'type'         : 'value2'
    ,'number'       : 'value3'
    ・・・
    ,'source'       : 'valuex'
    ,'remark'       : 'valuey'
    }
'''
#Wikitextのパースを行う
#フレーバーやカード名に区切り文字('{{','}}','|','=')が使用されるとエラーが発生する。
def parse_wikitext(wikitext: str) -> dict:

    try:
        #{{または}}で区切る。3つに分割されるが必要なのは1番目だけ。
        wikitext_main = re.split('{{|}}', wikitext)[1]
        #|で区切った後、整形(文字列両端の空白を取り除く)
        splited_wikitext = wikitext_main.split('|')
        dict_splitted_wikitext = {}
        for ele in splited_wikitext:
            #分割後の文字列をそれぞれ=で区切る。Cardtableは棄却する
            if ele == 'Cardtable' :
                continue
            splitted_ele = ele.split('=')
            #要素 = 値を辞書として'要素' : '値'にして保存。全てstr
            dict_splitted_wikitext[splitted_ele[0].strip()] = splitted_ele[1].strip()

        return dict_splitted_wikitext
    except:
        raise ParseError("Failed to Parse Wikitext.")

def format_carddata(dw : dict, pageid : int, latest_revid : int, pagetitle : str) ->CardData:
    carddata = CardData()
    carddata.convert_wikitextdict(pageid, dw['name'], dw['cost'], dw['attack'], dw['object_class'], dw['card_type'], dw['sub_type'], dw['effect_text'], dw["tags"], dw["limited"], latest_revid, pagetitle)
    return carddata
    


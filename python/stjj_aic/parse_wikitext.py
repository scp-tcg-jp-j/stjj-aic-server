#!/usr/bin/python3
import json
import mwparserfromhell

def parse_wikitext(wikitext, wt, cardid_list):
    tps = mwparserfromhell.parse(wikitext).filter_templates()[0].params
        
    vals = []
    for val in tps:
        print(val)
        vals.append(val.split("=")[1].strip())

    cardprops = {}
    cardprops["pageid"] = int(wt)
    cardprops["name"] = vals[4]
    cardprops["cost"] = int(vals[8]) if vals[8] != '' else None
    cardprops["attack"] = int(vals[7]) if vals[7] != '' else None
    cardprops["oc"] = vals[6] if vals[6] != "" else None
    cardprops["maintypes"] = vals[0].split(' ')
    cardprops["subtypes"] = vals[1].split(' ') if vals[1].split(' ')[0] != "" else None
    cardprops["effect"] = vals[9] if vals[9] != "" else None
    cardprops["tags"] = vals[11].split(' ') if vals[11].split(' ')[0] != "" else None
    cardprops["banned"] = True if vals[12] == "永久収容" else False
    cardprops["latest_revid"] = cardid_list[int(wt)]["lastrevid"]

    return cardprops

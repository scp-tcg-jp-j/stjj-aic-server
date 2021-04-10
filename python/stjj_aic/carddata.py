class ConvertError(Exception):
    pass


class CardData:
    _carddata = {}

    def to_Canon(self, a):
        for idx in range(len(a)):
            if a[idx] == 'canon' or a[idx] == 'カノン':
                a[idx] = 'Canon'
        return a

    #各wikitextから得られた要素をカードデータに変換(型注釈無しは全部str)
    def convert_wikitextdict(self, pageid : int, name, cost, attack, oc, maintypes, subtypes, effect, tags, banned, lastrevid: int, page_title):
        try:
            self._carddata["pageid"] = pageid
            self._carddata["name"] = name
            self._carddata["cost"] = int(cost) if cost != '' else None
            self._carddata["attack"] = int(attack) if attack != '' else None
            self._carddata["oc"] = oc if oc != "" else None
            self._carddata["maintypes"] = self.to_Canon(maintypes.split(' '))
            self._carddata["subtypes"] = subtypes.split(' ') if subtypes.split(' ')[0] != "" else None
            self._carddata["effect"] = effect if effect != "" else None
            self._carddata["tags"] = tags.split(' ') if tags.split(' ')[0] != "" else None
            self._carddata["banned"] = True if banned == "永久収容" else False
            self._carddata["lastrevid"] = lastrevid
            self._carddata["page_title"] = None if name == page_title else page_title
        except:
            raise ConvertError("Failed to Convert Wikitext to dict.")
            

    def getCardDataDict(self) -> dict:
        return self._carddata
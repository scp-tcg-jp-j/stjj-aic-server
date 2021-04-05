#!/usr/bin/python3
# -*- coding: utf-8 -*-

import requests

class GetPostRequest:
    url = ""
    session = requests.Session()
    def __init__(self, urlname):
        self.url = urlname

    def getRequest(self, data, verify = True):
        return self.session.get(self.url, params = data, verify = verify)
    
    def postRequest(self, data, verify = True):
        return self.session.post(self.url, data = data, verify = verify)
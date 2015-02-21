from xml.etree.ElementTree import fromstring
import requests

# This program queries Yandex to get potential station urls and writes to given file

file_name = "../urls/urls2.txt"

def findurl(roo):
    for child in roo:
        if child.tag != "response":
            continue
        for child2 in child:
            if child2.tag != "results":
                continue
            for child3 in child2:
                for child4 in child3:
                    if child4.tag != "group":
                        continue
                    for child5 in child4:
                        if child5.tag != "doc":
                            continue
                        for child6 in child5:
                            if child6.tag != "url":
                                continue
                            f.write(child6.text.encode("utf-8") + "\n")


def urlpage():
    k = 0
    while k < 60:
        n = 0
        while n < 11:
            r = requests.get("http://xmlsearch.yandex.com/xmlsearch?user="
                             "karlwithak&key=03.304384900:f9010bc4fa6edb0e00c4d"
                             "309532ba3e8&query=%22SHOUTcast+Administrator%22"
                             "+%2B+%22m+"
                             + str(k) + "s%22"
                             "&l10n="
                             "en&sortby=tm.order%3Dascending&filter"
                             "=none&groupby=attr%3D%22%22.mode%3Dflat.groups-on-page"
                             "%3D99.docs-in-group%3D1&page=" + str(n))
            root = fromstring(r.text.encode("utf-8"))
            findurl(root)
            n += 1
            print("page " + str(n) + " sec" + str(k))
        k += 1

f = open(file_name)
urlpage()
f.close()

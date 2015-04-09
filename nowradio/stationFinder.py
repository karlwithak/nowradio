from xml.etree.ElementTree import fromstring
import ourUtils
import model
import requests
import socket
from dbManager import Queries, get_connection
from lxml import html
import serverInfo

# This program queries Yandex to get potential stations and puts the station information into the
#   database if they are up and serving mp3 and don't cause any other problems.
# Note, it will not make ANY modifications to db entries that have the same ip. Specifically it
#   will not update things like active listeners
# This is good because we do don't not have to make unnecessary requests to station servers


def yandex_query(genre_list, url_set):
    for genre in genre_list:
        genre = genre.replace(" ", "+")
        genre = genre.replace("%", "")
        for page_num in range(10):
            r = requests.get(
                "https://xmlsearch.yandex.com/xmlsearch?"
                "user=" + serverInfo.yandex_user +
                "&key=" + serverInfo.yandex_key +
                "&query=%22SHOUTcast+Administrator%22+%2B+%22" + genre + "%22"
                "&l10n=en"
                "&sortby=rlv"
                "&filter=none"
                "&maxpassages=1"
                "&groupby=attr%3D%22%22.mode%3Dflat.groups-on-page%3D100.docs-in-group%3D1"
                "&page=" + str(page_num))
            root = fromstring(r.text.encode("utf-8"))
            urls = root.findall(".//url")
            urls = set(url.text for url in urls)
            url_set.update(urls)
            if len(urls) < 100:
                break


def url_to_ip(url_list, ip_set):
    thread_ip_set = set()
    for url in url_list:
        try:
            ip = ourUtils.ip_from_url(url)
        except socket.gaierror:
            pass
        else:
            thread_ip_set.add(ip)
    ip_set.update(thread_ip_set)


def station_checker(ip_list, checked_ip_set):
    thread_ip_set = set()
    for ip in ip_list:
        try:
            r = requests.get("http://" + ip + "/7.html", headers=ourUtils.request_header, timeout=2)
            if r.status_code in (200, 304) and len(r.text) < 250:
                content = r.text[r.text.index("<body>") + 6:r.text.index("</body>")]
                server_status = content[content.index(",") + 1]
                if server_status == '1' and content.count(",") == 6:
                    thread_ip_set.add(ip)
        except Exception:
            pass
    checked_ip_set.update(thread_ip_set)


def insert_new_station(ip_list, connection):
    cur = connection.cursor()
    for ip in ip_list:
        try:
            cur.execute(Queries.check_for_station, (ip,))
            if cur.rowcount == 1:
                continue
            page = requests.get("http://" + ip, headers=ourUtils.request_header, timeout=2)
            info = html.fromstring(page.text).xpath("//b")
            if info[0].text == "Server is currently up and public." and info[6].text == "audio/mpeg":
                listeners = info[2].text
                cur_listeners = listeners[:listeners.index(" ")]
                max_listeners = listeners[listeners.index("of")+3:listeners.index("listeners")-1]
                peak_listeners = info[3].text
                name = info[5].text
                genre = info[7].text
                if cur_listeners.isdigit() and max_listeners.isdigit() and peak_listeners.isdigit():
                    data = {
                        'active': cur_listeners,
                        'max':    max_listeners,
                        'peak':   peak_listeners,
                        'name':   name,
                        'genre':  genre,
                        'ip':     ip
                    }
                    cur.execute(Queries.insert_station, data)
                    print("added new station: " + str(ip))
        except Exception:
            pass
    cur.close()


def our_genre_setter(connection):
    curr = connection.cursor()
    curr.execute(Queries.set_our_genre_null)
    for i in range(len(model.genre_list)):
        data = {
            'our_genre': model.genre_names[i],
            'genre_names': model.genre_list[i]
        }
        curr.execute(Queries.set_our_genre_by_genre, data)


def main():
    assert serverInfo.yandex_key != "", "Yandex_key is empty is serverInfo."
    assert serverInfo.yandex_user != "", "Yandex_user is empty is serverInfo."
    genres = ourUtils.flatten_list(model.genre_list)
    url_set = set()
    ourUtils.multi_thread_runner(genres, yandex_query, url_set)
    print("done yandex_query")
    ip_set = set()
    ourUtils.multi_thread_runner(list(url_set), url_to_ip, ip_set)
    print("done url_to_ip")
    checked_ip_set = set()
    ourUtils.multi_thread_runner(list(ip_set), station_checker, checked_ip_set)
    print("done station_checker")
    conn = get_connection()
    if conn is None:
        exit("could not make database connection")
    ourUtils.multi_thread_runner(list(checked_ip_set), insert_new_station, conn)
    conn.commit()
    print("done station_checker")
    our_genre_setter(conn)
    conn.commit()
    conn.close()
    print("done our_genre_setter")

if __name__ == '__main__':
    main()

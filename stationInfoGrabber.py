import requests
from lxml import html
import threading
import psycopg2

# This program looks at all urls in the given file and puts the station information into the
#   database if they are up and serving mp3 and don't cause any other problems
# Note, it will not make ANY modifications to db entries that have the same url. Specifically it
#   will not update things like active listeners
# This is good because we do don't not have to make unnecessary requests to station servers

dbpass = "VG9kYXkgaXMgYSBsb3ZlbHkgZGF5LCBpc24ndCBpdD8K"  # TODO hide?
filename = "urls/uniqueCheckedUrls.txt"

insert_query = "INSERT INTO station_info " \
               "(url, active_listeners, max_listeners, peak_listeners, name, genre) " \
               "VALUES (%(url)s, %(active)s, %(max)s, %(peak)s, %(name)s, %(genre)s);"

select_query = "SELECT 1 " \
               "FROM station_info " \
               "WHERE url = %s"


def worker(url_list, connection):
    cur = connection.cursor()
    for url in url_list:
        cur.execute(select_query, (url,))
        if cur.rowcount == 1:
            print("skipping existing url: " + url)
            continue
        try:
            page = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=1)
            info = html.fromstring(page.text).xpath("//b")
            if info[0].text == "Server is currently up and public." and info[6].text == "audio/mpeg":
                listeners = info[2].text
                cur_listeners = listeners[:listeners.index(" ")]
                max_listeners = listeners[listeners.index("of")+3:listeners.index("listeners")-1]
                peak_listeners = info[3].text
                name = info[5].text
                genre = info[7].text
                if cur_listeners.isdigit() and max_listeners.isdigit() and peak_listeners.isdigit():
                    print("adding new url: " + url)
                    data = {
                        'url':    url,
                        'active': cur_listeners,
                        'max':    max_listeners,
                        'peak':   peak_listeners,
                        'name':   name,
                        'genre':  genre}
                    cur.execute(insert_query, data)
                else:
                    print("got non-numeric data for: " + url)
        except requests.ConnectionError:
            print("skipping due to con error: " + url)
        except requests.Timeout:
            print("skipping due to timeout: " + url)
        except IndexError:
            print("skipping due to bad content: " + url)
        except psycopg2.DataError as e:
            print("uh oh, data error on " + url)
            print("stack trace: \n" + str(e))
    cur.close()


def runner(url_list, connection, threads):
    total_stations = len(url_list)
    thread_count = 25
    step = total_stations/thread_count
    for i in range(0, total_stations, step):
        t = threading.Thread(target=worker, args=(url_list[i:i+step], connection))
        threads.append(t)
        t.start()
    for thread in threads:
        thread.join()


def main():
    with open(filename) as myfile:
        urls = myfile.read().split('\n')[:-1]
    conn = None
    try:
        conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    except psycopg2.DatabaseError:
        print("could not connect to db")
        exit("could not connect to db")
    threads = []
    runner(urls, conn, threads)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()
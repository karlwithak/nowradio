import requests
import ourUtils
import psycopg2
from dbManager import Queries, dbpass


# This program goes through the list of stations in the db and updates information such as
#   current listeners, max listeners, peak listeners, status(up or not)


def worker(id_url_list, connection):
    cur = connection.cursor()
    for id_url in id_url_list:
        url = id_url[1] + '7.html'
        try:
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=2)
        except requests.ConnectionError:
            print("connection error: " + url)
            cur.execute(Queries.set_station_down, (id_url[0],))
        except requests.Timeout:
            print("timeout error   : " + url)
        except Exception:
            print("unknown error   : " + url)
            cur.execute(Queries.set_station_down, (id_url[0],))
        else:
            if response.status_code in (200, 304) and response.text.count(",") >= 6:
                info = response.text.split(",")
                data = {
                    'is_up':  bool(info[1]),
                    'peak':   info[2],
                    'max':    info[3],
                    'active': info[4],
                    'id':     id_url[0]
                }
                cur.execute(Queries.update_station_by_id, data)
            else:
                print("bad response: " + url)
    cur.close()


def main():
    conn = None
    try:
        conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    except psycopg2.DatabaseError:
        print("could not connect to db")
        exit("could not connect to db")
    id_url_list = ourUtils.db_quick_query(conn, Queries.get_all_urls)
    ourUtils.multi_thread_runner(id_url_list, worker, conn)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()

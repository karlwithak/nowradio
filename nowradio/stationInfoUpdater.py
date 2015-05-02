import requests
import ourUtils
from dbManager import Queries, get_connection


# This program goes through the list of stations in the db and updates information such as
#   current listeners, max listeners, peak listeners, status(up or not)


def worker(id_url_list, connection):
    cur = connection.cursor()
    for id_ip in id_url_list:
        url = "http://" + id_ip[1] + '/7.html'
        try:
            response = requests.get(url, headers=ourUtils.request_header, timeout=2)
        except requests.ConnectionError:
            print("connection error: " + url)
            cur.execute(Queries.set_station_down, (id_ip[0],))
        except requests.Timeout:
            print("timeout error   : " + url)
            cur.execute(Queries.set_station_down, (id_ip[0],))
        except Exception:
            print("unknown error   : " + url)
            cur.execute(Queries.set_station_down, (id_ip[0],))
        else:
            if response.status_code in (200, 304) \
                    and response.text.count(",") >= 6 \
                    and len(response.text) < 2056:
                info = response.text.split(",")
                data = {
                    'is_up':  bool(info[1]),
                    'peak':   info[2],
                    'max':    info[3],
                    'active': info[4],
                    'id':     id_ip[0]
                }
                cur.execute(Queries.update_station_by_id, data)
            else:
                print("bad response: " + url)
                cur.execute(Queries.set_station_down, (id_ip[0],))
    cur.close()


def main():
    conn = get_connection()
    if conn is None:
        exit("could not connect to db")
    id_url_list = ourUtils.db_quick_query(conn, Queries.get_all_ips)
    ourUtils.multi_thread_runner(id_url_list, worker, conn)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()

import requests
import threading
import psycopg2

# This program goes through the list of stations in the db and updates information such as
#   current listeners, max listeners, peak listeners, status(up or not)

dbpass = "VG9kYXkgaXMgYSBsb3ZlbHkgZGF5LCBpc24ndCBpdD8K"  # TODO hide?

get_highest_id = "SELECT id  FROM station_info " \
                 "ORDER BY id DESC " \
                 "LIMIT 1;"

get_urls_between_ids = "SELECT id, url FROM station_info " \
                       "WHERE id BETWEEN %s AND %s;"

update_station_by_id = "UPDATE station_info " \
                       "SET (active_listeners, max_listeners, peak_listeners, last_updated, is_up)" \
                       "  = (%s, %s, %s, NOW(), %s) " \
                       "WHERE id = %s;"

set_station_down = "UPDATE station_info " \
                   "SET is_up = FALSE " \
                   "WHERE id = %s"


def worker(lo_id, hi_id, connection):
    cur = connection.cursor()
    cur.execute(get_urls_between_ids, (lo_id, hi_id))
    id_url_list = cur.fetchall()
    for id_url in id_url_list:
        url = id_url[1] + '7.html'
        try:
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=2)
        except requests.ConnectionError:
            print("connection error: " + url)
            cur.execute(set_station_down, (id_url[0],))
        except requests.Timeout:
            print("timeout error   : " + url)
        except Exception:
            print("unknown error   : " + url)
            cur.execute(set_station_down, (id_url[0],))
        else:
            if response.status_code in (200, 304) and response.text.count(",") >= 6:
                info = response.text.split(",")
                is_up = bool(info[1])
                peak_listeners = info[2]
                max_listeners = info[3]
                active_listeners = info[4]
                cur.execute(update_station_by_id,
                            (active_listeners, max_listeners, peak_listeners, is_up, id_url[0]))
            else:
                print("bad response: " + url)
    cur.close()


def runner(connection, threads):
    runner_cur = connection.cursor()
    runner_cur.execute(get_highest_id)
    top_id = runner_cur.fetchone()[0]
    thread_count = 50
    step = top_id/thread_count
    for i in range(0, top_id, step):
        t = threading.Thread(target=worker, args=(i, i + step, connection))
        threads.append(t)
        t.start()
    for thread in threads:
        thread.join()
    runner_cur.close()


def main():
    conn = None
    try:
        conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    except psycopg2.DatabaseError:
        print("could not connect to db")
        exit("could not connect to db")
    threads = []
    runner(conn, threads)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()

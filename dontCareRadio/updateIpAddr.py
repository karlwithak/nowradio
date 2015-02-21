import socket
import threading

import psycopg2

from dbManager import Queries, dbpass
import ourUtils


def worker(id_url_list, conn):
    cur = conn.cursor()
    for id_url in id_url_list:
        try:
            ip = ourUtils.ip_from_url(id_url[1])
        except socket.gaierror:
            print("socket error on " + id_url[1])
        else:
            cur.execute(Queries.set_ip_for_id, [ip, id_url[0]])
    cur.close()


def main():
    conn = psycopg2.connect("dbname=radiodb user=radiodb host=localhost password=%s" % dbpass)
    main_cur = conn.cursor()
    main_cur.execute(Queries.get_all_urls)
    id_url_list = main_cur.fetchall()
    threads = []
    thread_count = 25
    step = len(id_url_list)/thread_count
    for i in range(0, len(id_url_list), step):
        t = threading.Thread(target=worker, args=(id_url_list[i:i + step], conn))
        threads.append(t)
        t.start()
    for thread in threads:
        thread.join()
    main_cur.close()
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()
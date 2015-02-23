import socket
import threading


def ip_from_url(url):
    """
    Takes a url with our without port and returns equivalent ip address
    :type url: string
    :rtype string
    """
    url = url[0:url.index("/", 8) + 1]
    url = url.replace("http://", "")[:-1]
    port = ""
    if ":" in url:
        port = url[url.index(":"):]
        url = url[:url.index(":")]
    return socket.gethostbyname(url) + port


def multi_thread_runner(data_list, worker, extra_arg=None):
    """
    Helps to write multi-threaded code by dispatching subsets of data to worker threads
    :type data_list: list
    :type worker: (list, (object | None)) -> None
    :type extra_arg: object | None
    :return: None
    """
    threads = []
    thread_count = 32
    data_size = len(data_list)
    if data_size <= thread_count:
        thread_count = 1
    step_size = data_size/thread_count
    for i in range(0, data_size, step_size):
        data_subset = data_list[i: step_size + i]
        if extra_arg is None:
            t = threading.Thread(target=worker, args=(data_subset,))
        else:
            t = threading.Thread(target=worker, args=(data_subset, extra_arg))
        threads.append(t)
        t.start()
    for thread in threads:
        thread.join()


def db_quick_query(db_conn, query, data=None):
    """
    Creates cursor, does query, gets result to be returned, closes cursor
    :type db_conn: psycopg2.connection
    :type query: string
    :type data: list | dict | tuple | None
    :return: result of the query
    """
    cursor = db_conn.cursor()
    cursor.execute(query, data)
    result = cursor.fetchall()
    cursor.close()
    return result
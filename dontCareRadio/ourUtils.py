import socket
import threading


def ip_from_url(url):
    """
    Takes a url with our without port and returns equivalent ip address
    :param url: url with or without 'http://' and trailing slash
    :return: ip address that points to the same location as url, with no slashes at all
    """
    url = url.replace("http://", "")[:-1]
    port = ""
    if ":" in url:
        port = url[url.index(":"):]
        url = url[:url.index(":")]
    return socket.gethostbyname(url) + port


def multi_thread_runner(data_list, worker, extra_arg=None):
    """
    Helps to write multi-threaded code
    :param data_list: the list of arguments, a subset of which will be passed to each worker
    :param worker: a function that takes a subset of data_list an extra_arg (if given)
    :param extra_arg: an extra argument to pass to each worker. ex: db connection
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


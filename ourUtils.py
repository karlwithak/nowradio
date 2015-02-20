import socket


def ip_from_url(url):
    url = url.replace("http://", "")[:-1]
    if ":" in url:
        url = url[:url.index(":")]
    return socket.gethostbyname(url)

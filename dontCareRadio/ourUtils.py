import socket


def ip_from_url(url):
    url = url.replace("http://", "")[:-1]
    port = ""
    if ":" in url:
        port = url[url.index(":"):]
        url = url[:url.index(":")]
    return socket.gethostbyname(url) + port

import socket
import psycopg2
from dbManager import Queries, dbpass
import ourUtils

# This program reads urls from a file and prints their corresponding ip addresses

filename = "../urls/uniqueCheckedUrls.txt"


def worker(url_list):
    for url in url_list:
        try:
            ip = ourUtils.ip_from_url(url)
        except socket.gaierror:
            print("socket error on " + url)
        else:
            print(ip)


def main():
    with open(filename) as myfile:
        urls = myfile.read().split('\n')[:100]
    ourUtils.multi_thread_runner(urls, worker)

if __name__ == '__main__':
    main()
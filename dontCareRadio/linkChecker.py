import requests
request_header = {'User-Agent': 'Mozilla/5.0'}
import ourUtils

# This program reads urls from a file and outputs only urls that point to a legit station that
#   is currently broadcasting

file_name = "../urls/bingUrls.txt"


def handle_response(r, url):
    try:
        if r.status_code in (200, 304) and len(r.text) < 500:
            content = r.text[r.text.index("<body>") + 6:r.text.index("</body>")]
            server_status = content[content.index(",") + 1]
            if server_status == '1' and content.count(",") == 6:
                print(url)
    except Exception:
        return


def worker(worker_list):
    for url in worker_list:
        try:
            if url.count("/") == 3:
                url = url[0:url.index("/", 8) + 1]
                r = requests.get(
                    url + "7.html",
                    headers=request_header,
                    timeout=1)
                handle_response(r, url)
        except Exception:
            continue


def main():
    with open(file_name) as myfile:
        urls = myfile.read().split('\n')[:-1]
    ourUtils.multi_thread_runner(urls, worker)

if __name__ == '__main__':
    main()
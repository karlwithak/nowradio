import threading
import requests
import time
request_header = {'User-Agent': 'Mozilla/5.0'}

def worker(worker_list):
    for url in worker_list:
        try:
            r = requests.get(
                url[0:url.rindex("/") + 1] + "7.html",
                headers=request_header,
                timeout=4)
            if r.status_code not in (200, 304):
                pass  #print "status code:" + str(r.status_code) + " + url" + url
            else:
                print r.text[64:]
                p.release()
        except requests.ConnectionError:
            pass  #print "ConnectionError on url:" + url
        except requests.Timeout:
            pass  #print "Timeout on url:" + url


def runner(url_list):
    total_stations = 41545
    step = 100
    for i in range(0, total_stations, step):
        t = threading.Thread(target=worker, args=([url_list[i:i+step]]))
        threads.append(t)
        t.start()

p = threading.Semaphore()
threads = []
f = open("urls2.txt")
urls = f.read()
startTime = time.time()
runner(urls.split('\n')[:-1])
for thread in threads:
    thread.join()
counter = 0
while p.acquire(False):
    counter += 1
print "found " + str(counter) + " legit stations"
print time.time() - startTime
f.close()
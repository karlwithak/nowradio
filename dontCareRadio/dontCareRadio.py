from logging import FileHandler
import logging
import requests
from flask import Flask, render_template, request, jsonify
from dbManager import Queries, get_connection
import model
import ourUtils
import serverInfo

# This file is the first that is called when someone goes to a page on our website.
# It looks at the url that they entered and decides what computation to do and what
#   template to show them.

app = Flask(__name__, template_folder="../templates")

app.config['APP_NAME'] = "Don't Care Radio"
app.config['DEBUG'] = serverInfo.is_development
app.config.from_pyfile('../conf/flask.conf.py')
file_handler = FileHandler(serverInfo.flask_log_file)
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
page_size = 100


db_conn = get_connection()
if db_conn is None:
    exit("could not make connection to db")


@app.route('/')
def render_landing():
    return render_template("player.html")


@app.route('/get-initial-stations/')
def get_initial_stations():
    cur = db_conn.cursor()
    stations = []
    data = {'page_size': page_size}
    for genre in model.genre_names:
        data['genre_name'] = genre
        cur.execute(Queries.get_ips_by_genre, data)
        result = ourUtils.flatten_list(cur.fetchall())
        stations.append(result)
    return jsonify(stations=stations)


@app.route('/get-genre-by-ip/')
def get_genre_by_ip():
    ip = request.args.get('ip', '')
    results = ourUtils.db_quick_query(db_conn, Queries.get_our_genre_by_ip, (ip,))[0]
    genre_num = model.genre_names.index(results[0])
    return jsonify(genreNum=genre_num)


@app.route('/get-station-info/')
def get_station_info():
    result = requests.get(request.args.get('stationUrl'), headers=ourUtils.request_header)
    return result.text

if __name__ == '__main__':
    app.run()

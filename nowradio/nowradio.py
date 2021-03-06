from logging import FileHandler
import logging
import requests
from flask import Flask, render_template, request, jsonify, abort
from dbManager import Queries, get_connection
import constants
import ourUtils
import serverInfo

# This file is the first that is called when someone goes to a page on our website.
# It looks at the url that they entered and decides what computation to do and what
#   template to show them.

app = Flask(__name__, template_folder="../templates", static_folder="../static")

app.config['APP_NAME'] = "NowRadio"
app.config['APP_SLOGAN'] = "Listen to music now."
app.config['DEBUG'] = serverInfo.is_development
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


@app.route('/info/')
def render_info():
    return render_template("info.html")


@app.route('/get-initial-stations/')
def get_initial_stations():
    cur = db_conn.cursor()
    stations = []
    data = {
        'page_size': page_size,
        'active_weight': constants.ACTIVE_LISTENER_WEIGHT,
        'faves_weight': constants.FAVE_WEIGHT,
        'timeout_weight': constants.TIMEOUT_COUNT_WEIGHT
    }
    for genre in constants.genre_names:
        data['genre_name'] = genre
        cur.execute(Queries.get_good_ips_by_genre, data)
        rows = cur.fetchall()
        result = []
        for row in rows:
            station = {}
            station['ip_addr'] = row[0]
            station['latitude'] = row[1]
            station['longitude'] = row[2]
            result.append(station)
        stations.append(result)
    cur.close()
    db_conn.commit()
    return jsonify(stations=stations)


@app.route('/get-genre-by-ip/')
def get_genre_by_ip():
    ip = request.args.get('ip', '')
    results = ourUtils.db_quick_query(db_conn, Queries.get_our_genre_by_ip, (ip,))
    if len(results) == 0:
        abort(400)
    genre_num = constants.genre_names.index(results[0][0])
    return jsonify(genreNum=genre_num)


@app.route('/report-fave-changed/', methods=['POST'])
def report_fave_changed():
    ip = request.form['ip']
    fave_was_added = request.form['faveWasAdded']
    if fave_was_added == "true":
        ourUtils.db_quick_query(db_conn, Queries.update_fave_increase, (ip,))
    else:
        ourUtils.db_quick_query(db_conn, Queries.update_fave_decrease, (ip,))
    db_conn.commit()
    return 'OK'


@app.route('/report-timeout/', methods=['POST'])
def report_timeout():
    ip = request.form['ip']
    ourUtils.db_quick_query(db_conn, Queries.report_timeout, (ip,))
    db_conn.commit()
    return 'OK'


@app.route('/get-station-info/')
def get_station_info():
    result = requests.get(request.args.get('stationUrl'), headers=ourUtils.request_header)
    return result.text

if __name__ == '__main__':
    if serverInfo.is_development:
        app.run(host='0.0.0.0', port=serverInfo.public_port, debug=True)
    else:
        app.run()

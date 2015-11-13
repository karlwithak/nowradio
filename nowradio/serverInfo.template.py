# This must be filled in and saved as serverInfo.py

is_development = True

public_port = 5000

db_pass = "nowradio_pass"
db_name = "nowradio_db"
db_user = "nowradio_user"
db_host = "localhost"

# We use yandex.com to find new station. You only need to fill this in if you want to run the
# the nowradio/stationFinder.py script. To get these credentials, make an account
# here: https://api.yandex.com/xml
yandex_user = ""
yandex_key = ""

log_base_dir = "logs/"
flask_log_file = log_base_dir + "flask.log"

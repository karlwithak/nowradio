#NowRadio

NowRadio is an internet radio music player. It allows users to easily navigate between different 
stations and different genres so they can find something they like. Check it out at  http://nowrad.io

##SETUP

Tested on Ubuntu 14.04 x64

`sudo apt-get update`

Install necessary packages

```
sudo apt-get install -y \
    postgresql-9.3 postgresql-server-dev-9.3 \
    git \
    python-psycopg2 python-dev python-pip \
    build-essential libxml2-dev libxslt-dev 
```

Go to the directory where you want NowRadio to be installed

`git clone https://github.com/karlwithak/nowradio.git`

`cd nowradio`

Install necessary python packages. Note: Depending on your setup, you may want to use a 
[virtual environment](https://virtualenv.pypa.io)

`sudo pip install -r python_requirements.txt`

Login as postgres user

`sudo su postgres`

Create new database user

`createuser -dP nowradio_user`

Enter password: `nowradio_pass` or whatever you have in serverInfo.py

Create database;

`createdb --owner=nowradio_user nowradio_db`

Fill up database;

`psql nowradio_db < db/station_info_dump.sql`

Exit postgres user;

`exit`

`cd nowradio`

Note that serverInfo.py is never checked in and may contain secret info. If you want to use
a different password for the database user, it must also be changed here.

`cp serverInfo.template.py serverInfo.py`

Start NowRadio!

`python nowradio.py`


You should now be able to view the running app at localhost:5000
or if installed on a server will be running at \[server ip\]:5000
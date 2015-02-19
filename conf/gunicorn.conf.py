workers = 2 
bind = '0.0.0.0:8000'
daemon = True
reload = True
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'

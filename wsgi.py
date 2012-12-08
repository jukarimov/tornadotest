#!/usr/bin/env python
# coding:utf-8

# http://en.wikipedia.org/wiki/Representational_state_transfer
import os
import sys

cwd = os.path.dirname(__file__)

import tornado.ioloop
import tornado.httpserver
from tornado.web import RequestHandler

from psycopg2 import connect
from psycopg2.extras import RealDictCursor

from json import loads as json_parse

class Main(RequestHandler):
  def get(self):

    clientui = self.get_argument('ui', None)

    if clientui == 'kendo':
      self.render('kendoedit.html')
    else:
      self.render('edit.html')

class APINotes(RequestHandler):
  def get(self):
    conn = connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM books')
    records = cursor.fetchall()

    self.write({
      'total':len(records),
      'rows':records
    })

  def post(self):
    conn = connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
    cursor = conn.cursor()

    data = self.get_argument('data')
    print 'data posted:', data
    rows = json_parse(data)
    for row in rows:
      cursor.execute("SELECT * FROM addbook(%s, %s, %s);",
		      (row['id'], row['name'], row['author']))
    conn.commit()
    conn.close()

  def put(self):
    print 'put called'

  def delete(self):
    print 'delete called'
    data = self.get_argument('data')
    print 'delete:', data 


class Delete(RequestHandler):
  def post(self):
    conn = connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
    cursor = conn.cursor()

    data = self.get_argument('data')
    print 'data posted:', data

    rows = json_parse(data)
    for row in rows:
      cursor.execute("DELETE FROM books WHERE id=%s;", (row['id'],))
    conn.commit()
    conn.close()

routes = [
  (r'/', Main),
  (r'/delete/', Delete),
  (r'/api/notes/', APINotes),
  (r'/api/notes/([^/]*)', APINotes),
]

settings = {
  'debug': True,
  'static_path': '%s/pub/media' % cwd,
  'static_url_prefix': '/media/',
  'template_path': '%s/tpl/' % cwd,
}

if __name__=='__main__':
  app = tornado.web.Application(routes, **settings)
  http_server = tornado.httpserver.HTTPServer(app)
  http_server.listen(8000)
  print 'http://localhost:8000'
  tornado.ioloop.IOLoop.instance().start()


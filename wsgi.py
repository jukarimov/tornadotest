#!/usr/bin/env python
# coding:utf-8
# http://en.wikipedia.org/wiki/Representational_state_transfer

import os
import sys

cwd = os.path.dirname(__file__)

import tornado.ioloop
import tornado.httpserver

from tornado.web import RequestHandler
from tornado.web import HTTPError

from psycopg2 import connect
from psycopg2.extras import RealDictCursor

from datetime import date
import json, re

def isempty(string):
  if string == '' or string == None:
    return True
  return False

sql_ops = {
    'eq'              :'=',
    'neq'             :'!=',
    'lt'              :'<',
    'gt'              :'>',
    'gte'              :'>=',
    'lte'              :'<=',
    'contains'        :'ilike',
    'doesnotcontain'  :'not ilike',
    'startswith'      :'ilike_sw',
    'endswith'        :'ilike_ew',
}
sql_logops = ['and','or']

book_list_columns = ['id', 'published', 'category', 'author', 'name']

def parseSQL(sqlc):
  exp_column = True
  exp_operator = False
  exp_value = False
  exp_logic = False
  cur_logic = ''
  prev_logic = ''
  opr = ''
  SQL = 'SELECT * FROM api.book_list WHERE '
  for i in sqlc.split(','):
    if exp_column:
      if cur_logic == '' or cur_logic != prev_opr:
        SQL += '('
        SQL += ' ' + i + ' '
        if i not in book_list_columns:
          print '*'*20
          print 'INCORRECT SQL CODE', i, 'COL NOT FOUND'
          print '*'*20
          return None
      else:
        print '*'*20
        print 'INCORRECT SQL CODE', i, 'COL NOT FOUND'
        print '*'*20
        return None
      exp_column = False
      exp_operator = True
      continue
    elif exp_operator:
      prev_opr = opr
      opr = sql_ops.get(i)
      if not opr:
        print '*'*20
        print 'INCORRECT SQL CODE', i
        print '*'*20
        return None
      SQL += opr + ' '
      exp_operator = False
      exp_value = True
      continue
    elif exp_value:
      SQL += 'E'
      i = re.sub('\'', '\\\'', i)
      if opr == 'ilike' or opr == 'not ilike':
        SQL += "'%%" + i + "%%' "
      elif opr == 'ilike_sw':
        SQL += "'" + i + "%%' "
      elif opr == 'ilike_ew':
        SQL += " '%%" + i + "' "
      else:
        SQL += "'" + i + "' "
      SQL += ') '
      exp_value = False
      exp_logic = True
      continue
    elif exp_logic:
      if i not in sql_logops:
        print '*'*20
        print 'INCORRECT SQL CODE', i
        print '*'*20
        return None
      prev_logic = cur_logic
      cur_logic = i
      SQL += i + ' '
      exp_logic = False
      exp_column = True
  SQL = re.sub('ilike_sw', 'ilike', SQL)
  SQL = re.sub('ilike_ew', 'ilike', SQL)
  SQL = re.sub('\) or \(', ' or ', SQL)
  SQL = re.sub('\'\)', '\'\)', SQL)
  return SQL

class DateEncoder(json.JSONEncoder):
  def default(self, obj):
    if isinstance(obj, date):
      return str(obj)
    return json.JSONEncoder.default(self, obj)

class Main(RequestHandler):
  def get(self):
    is_authorized = True
    if is_authorized:
      ui = self.get_argument('ui', 'main')
      self.render('%s.html' % ui, ui = ui)
    else:
      self.render('auth.html')

class list_categories(RequestHandler):
  @property
  def db(self):
    return connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")
  def get(self):
    conn    = self.db
    cursor  = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT category FROM api.book_list LIMIT 20')
    records = cursor.fetchall()
    self.write({
      'rows': records
    })

class APINotes(RequestHandler):
  @property
  def db(self):
    return connect("user='pguser' host='localhost' dbname='pgdb' password='pgpass'")

  def get(self, rid=None):
    sort_map = {
      'id'       :1,
      'published':2,
      'category' :3,
      'author'   :4,
      'name'     :5,
    }
    conn    = self.db
    cursor  = conn.cursor(cursor_factory=RealDictCursor)
    page    = self.get_argument('page', None)
    rows    = self.get_argument('rows', None)
    sort    = self.get_argument('sort', None)
    sqlc    = self.get_argument('sqlc', None)
    order   = self.get_argument('order', 'asc')

    if isempty(page) or isempty(rows):
      #print 'get: warning: no page or size specified'
      cursor.execute('SELECT * FROM api.book_list')

    else:
      try:
        page = abs(int(page) - 1)
        rows = abs(int(rows))
      except:
        self.write('Bad query')
        #print 'get: warning: Bad query', page, rows
        return
      if page > sys.maxint or rows > sys.maxint:
        self.write('Bad query')
        #print 'get: warning: Bad query', page, rows
        return
      if order not in [ 'asc', 'desc' ]:
        order = 'asc'
      if isempty(sqlc):
        cursor.execute('SELECT * FROM api.book_list \
                        ORDER BY %s ' + order + '   \
                        OFFSET %s                   \
                        LIMIT %s',
                        (sort_map.get(sort,1),
                          (page * rows),
                          rows))
      else:
        #print sqlc
        #print '-'*20, "PARSED SQL CODE", '-'*20
        SQL = parseSQL(sqlc)
        if not SQL:
          print 'Error parsing SQL'
          return
        #print SQL
        #print '-'*20, "CUT HERE", '-'*20
        cursor.execute(SQL + \
                       'ORDER BY %s ' + order + ' \
                        OFFSET %s                 \
                        LIMIT %s',
                        (sort_map.get(sort,1),
                          (page * rows),
                          rows))

    records = cursor.fetchall()
    records = json.loads(json.dumps(records, cls=DateEncoder))
    #print '-'*20, "ROWS", '-'*20
    #print 'GET:', records
    #print '-'*20, "END ROWS", '-'*20
    cursor.execute('SELECT COUNT(id) FROM schemas.book')
    total_rows = cursor.fetchall()[0]['count']
    cursor.close()
    self.write({
      'total': total_rows,
      'rows': records
    })

  def post(self, rid = None):
    name      = self.get_argument('name', None)
    author    = self.get_argument('author', None)
    category  = self.get_argument('category', None)
    published = self.get_argument('published', None)

    if isempty(name):
      #print 'post: warning: empty bookname'
      return
    if isempty(author):
      #print 'post: warning: empty author'
      return
    if isempty(category):
      #print 'post: warning: empty category'
      return
    if isempty(published):
      #print 'post: warning: empty published'
      return

    #print 'POST:', book, author, cat, published

    conn   = self.db
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM api.book_add(%s, %s, %s, %s)",
                    (published, category, author, name))
    conn.commit()
    conn.close()

  def put(self, rid=None):
    name      = self.get_argument('name')
    author    = self.get_argument('author')
    category  = self.get_argument('category', None)
    published = self.get_argument('published', None)
    rowid     = self.get_argument('id')
    conn      = self.db
    cursor    = conn.cursor()

    #print 'PUT:', rowid, book, author, cat, published

    if isempty(rowid):
      #print 'post: warning: empty rowid'
      return
    if isempty(name):
      #print 'post: warning: empty bookname'
      return
    if isempty(author):
      #print 'post: warning: empty author'
      return
    if isempty(category):
      #print 'post: warning: empty category'
      return
    if isempty(published):
      #print 'post: warning: empty published'
      return

    cursor.execute("SELECT * FROM api.book_update \
                    (%s, %s, %s, %s, %s)",
                    (rowid,    published,
                     category, author,
                     name
                    ))
    conn.commit()
    conn.close()

  def delete(self, rid=None):

    if not rid or rid == '':
      #print 'delete: warning: empty id'
      return

    conn   = self.db
    cursor = conn.cursor()
    cursor.execute("DELETE FROM schemas.book WHERE id = %s", (rid,))
    conn.commit()
    conn.close()

routes = [
  (r'/', Main),
  (r'/api/notes/cats', list_categories),
  (r'/api/notes/([^/]+)?/?', APINotes),
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
  print 'http://localhost:' + str(8000)
  tornado.ioloop.IOLoop.instance().start()

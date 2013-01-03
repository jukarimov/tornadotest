$(document).ready(function (){
  var dataSource = new kendo.data.DataSource({
    pageSize: 10,
    serverPaging: true,
    serverSorting: true,
    serverFiltering: true,
    transport: {
      read: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'GET',
      },
      create: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'POST',
        complete: function(request, textStatus) {
          $("#grid").data("kendoGrid").dataSource.read()
        }
      },
      update: {
        url: '/api/notes/',
        dataType: 'json',
        type: 'PUT',
      },
      destroy: {
        url: function(row) {
          return '/api/notes/' + row.id
        },
        type: 'DELETE',
      },
      parameterMap: function(options, operation) {
        var map = {}
        if (operation == 'read') {
          map.page = options.page
          map.rows = options.take
          map.sort = options.sort
          map.filt = options.filter
          map.sqlc = []
          if (map.sort) {
            map.sort = map.sort[0]
            if (map.sort) {
              var t = map.sort
              map.sort = t.field
              map.order = t.dir
            }
          }
          if (map.filt) {
            var filters = map.filt.filters
            for (i in filters) {
              if (filters[i].field) {
                var maplen = map.sqlc.length
                if (i > 0 && map.sqlc[maplen - 1] != 'and' && map.sqlc[maplen - 1] != 'or') {
                  map.sqlc.push(map.filt.logic)
                }
                map.sqlc.push(objunpack(filters[i]))
                if (i < filters.length-1) {
                  map.sqlc.push(map.filt.logic)
                }
              } else {
                var maplen = map.sqlc.length
                if (maplen > 0 && map.sqlc[maplen - 1] != 'and' && map.sqlc[maplen - 1] != 'or') {
                  map.sqlc.push(map.filt.logic)
                }
                map.sqlc.push(objunpack(filters[i].filters[0]))
                map.sqlc.push(objunpack(filters[i].logic))
                map.sqlc.push(objunpack(filters[i].filters[1]))
              }
              f = filters[i]
              if (!f.value || !f.field || !f.operator) {
                alert('Bad filter:' + map.sqlc)
                map.sqlc = [];
                return map;
              }
            }
            map.sqlc = map.sqlc.toString()
          }
        }
        if (operation == 'update') {
          map = options
          map.published = Date2MDY(options.published)
        }
        if (operation == 'create') {
          map = options
          map.published = Date2MDY(options.published)
        }
        return map
      },
    },
    schema: {
      data: function(reply) { 
        var rs = reply.rows
        return rs
      },
      total: function(reply) {
        var tt = reply.total
        return tt
      },
      model: {
        id: "id",
        fields: {
          id: {
            type: "number",
            editable: false,
          },
          name: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
          author: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
          published: {
            type: "date",
            editable: true,
            validation: { required: true }
          },
          category: {
            type: "string",
            editable: true,
            validation: { required: true }
          },
        },
      },
    },
  })

  $("#grid").kendoGrid({
    dataSource: dataSource,
    navigatable: true,
    pageable: true,
    //height: 500,
    editable: 'popup',
    sortable: true,
    filterable: true,
    scrollable: true,
    toolbar: [
      { name: "create", text: "Add" },
    ],
    columns: [
      { field: "id", title: "ID", width: 50 },
      { field: "name", title: "Name", width: 150 },
      { field: "author", title: "Author", width: 100 },
      { field: "published", title: "Published", format: "{0:MMMM yyyy}", width: 80 },
      { field: "category", title: "Category", width: 100, editor: categoryDropDownEditor },
      { command: ["edit", "destroy"], title: "&nbsp;", width: 110 },
    ],
  })
  $("#category_list").kendoDropDownList({
    placeholder: "Select category",
    dataTextField: "name",
    dataValueField: "name",
    dataSource: {
          transport: {
            read: {
              url: '/api/notes/cats',
              dataType: 'json',
              type: 'GET',
            },
          },
          schema: {
            data: function(reply) { 
              return reply.rows
            },
          },
    },
    change: function() {
      val = $("#category_list").val();
      var grid = $("#grid").data().kendoGrid;
      grid.dataSource.filter({
        "filters":[{"field":"category","operator":"eq","value":val}]
      })
    },
    open: function() {
      $("#category_list").data("kendoDropDownList").dataSource.read()
    }
  })
  function categoryDropDownEditor(contrainer, options) {
    $('<input data-text-field="name" data-value-field="name" data-bind="value:' + options.field + '"/>"')
      .appendTo(contrainer)
      .kendoComboBox({
        index: 0,
        placeholder: "Select category",
        dataTextField: "name",
        dataValueField: "name",
        dataSource: {
          transport: {
            read: {
              url: '/api/notes/cats',
              dataType: 'json',
              type: 'GET',
            },
          },
          schema: {
            data: function(reply) {
              return reply.rows
            },
          }
        }
      })
  }
})
$(window).resize(function(){
  var height = $(window).height()
  $('#grid').height(height - (height/9))
  $('#grid').find(".k-grid-content").height(height - (height/9) - 90)
})
function objunpack(o){
  if (o.field && o.operator && o.value) {
    if (o.field == 'published') {
      var t = o.value
      o.value = Date2MDY(t)
    }
    return [o.field, o.operator, o.value]
  }
  return o
}
function Date2MDY(date) {
  var dmy = '';
  dmy += String(date.getMonth()+1) + '-'
  dmy += String(date.getDate()) + '-'
  dmy += String(date.getFullYear())
  return dmy;
}

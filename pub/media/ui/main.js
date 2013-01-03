$(function(){
  var lastIndex;
  var lastEdit = 0;
  var tbl = $('#tt');
  tbl.datagrid({
    url: '/api/notes/',
    method: 'get',
    title: 'DataGrid',
    pagination: true,
    pageNumber: 1,
    pageSize: 10,
    sortName: 'id',
    sortOrder: 'asc',
    remoteSort: true,
    rownumbers: true,
    idField: 'id',
    nowrap: true,
    autoRowHeight: false,
    striped: true,
    singleSelect:true,
    fitColumns:true,
    onBeforeLoad: function() { $(this).datagrid('rejectChanges'); },
    onDblClickRow: function(rowIndex){
      if (lastIndex != rowIndex){
        $('#tt').datagrid('endEdit', lastIndex);
        $('#tt').datagrid('beginEdit', rowIndex);
      }
      lastIndex = rowIndex;
    }
  });
  $('#btn_add').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    tbl.datagrid('appendRow',{
      name        :'book title',
      author      :'book\'s author',
      published   :'12-13-2000',
      category    :'book category',
    });
    lastIndex = tbl.datagrid('getRows').length - 1;
    tbl.datagrid('selectRow', lastIndex);
    tbl.datagrid('beginEdit', lastIndex);
  });
  $('#btn_upd').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    var row = tbl.datagrid('getSelected');
    if (row) {
      var this_index = tbl.datagrid('getRowIndex', row);
      if (this_index == lastIndex && !lastEdit) {
        tbl.datagrid('endEdit', this_index);
        lastEdit = 1;
        return;
      }
      lastIndex = tbl.datagrid('getRowIndex', row);
      tbl.datagrid('beginEdit', lastIndex);
      lastEdit = 0;
    }
  });
  $('#btn_del').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    var row = tbl.datagrid('getSelected');
    if (row) {
      $.messager.confirm('Confirm','Are you sure you want to delete record?', function(r){
        if (r) {
          var n = tbl.datagrid('getRowIndex', row);
          tbl.datagrid('deleteRow', n);
        }
      });
    }
  });
  $('#btn_cancel').click(function(){
    tbl.datagrid('rejectChanges');
  });
  $('#btn_save').click(function(){
    var add_records = tbl.datagrid('getChanges', 'inserted');
    var upd_records = tbl.datagrid('getChanges', 'updated');
    var del_records = tbl.datagrid('getChanges', 'deleted');
    tbl.datagrid('acceptChanges');
    $.each(add_records, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'POST',
        'data': {
          'name'       :row.name,
          'author'     :row.author,
          'published'  :row.published,
          'category'   :row.category,
        }
      });
    });
    $.each(upd_records, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'PUT',
        'data': {
          'id'         :row.id,
          'name'       :row.name,
          'author'     :row.author,
          'published'  :row.published,
          'category'   :row.category
        }
      });
    });
    $.each(del_records, function(i, row) {
      $.ajax('/api/notes/' + row.id, {'type':'DELETE'});
    });
  });
});
$(window).resize(function(){
  var height = $(window).height();
  $('#tt').datagrid('resize', { height: height-30 } )
});

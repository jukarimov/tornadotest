
$(function(){
  var lastIndex;
  var lastEdit = 0;
  var tbl = $('#tt');
  tbl.datagrid({
				url: '/api/notes/',
    method: 'get',
    title: 'DataGrid',
    pagination: true,
    rownumbers: true,
    idField: 'id',
    nowrap: true,
    autoRowHeight: false,
    striped: true,
    sortName: 'id',
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
      id: nextID(),
      name: 'book title',
      author:'book\'s author',
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
						  //tbl.datagrid('unselectAll');
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
    var add_recods = tbl.datagrid('getChanges', 'inserted');
    var upd_recods = tbl.datagrid('getChanges', 'updated');
    var del_recods = tbl.datagrid('getChanges', 'deleted');

    tbl.datagrid('acceptChanges');

    $.each(add_recods, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'POST',
        'data': {
          'name':row.name,
          'author':row.author
        }
      });
    });

				$.each(upd_recods, function(i, row) {
						$.ajax('/api/notes/', {
								'type':'PUT',
								'data': {
										'id':row.id,
										'name':row.name,
										'author':row.author
								}
						});
				});

    $.each(del_recods, function(i, row) {
      $.ajax('/api/notes/' + row.id, {'type':'DELETE'});
    });
  });
});

function makeID(in_id) {
  var ID = '';
  var az = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var prevID = in_id;
  if (prevID[1] == 'Z') {
    ID += az[az.indexOf(prevID[0])+1];
    ID += 'A';
  } else {
    ID += prevID[0];
    ID += az[az.indexOf(prevID[1])+1];
  }
  return ID;
};

function nextID() {
  var rows = $('#tt').datagrid('getRows');
  var last_rowid = 0;
  if (rows.length)
    last_rowid = rows[rows.length - 1].id;
  last_rowid = parseInt(last_rowid);
  return (last_rowid + 1).toString();
};

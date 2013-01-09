$(function(){
  var lastIndex;
  var lastEdit = 0;
  var lastAdd = 0;
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
      update_icon_swap('done');
      if (lastIndex != rowIndex) {
        $('#tt').datagrid('endEdit', lastIndex);
        $('#tt').datagrid('beginEdit', rowIndex);
      }
      lastIndex = rowIndex;
    }
  });
  $('#btn_add').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    update_icon_swap('edit');
    tbl.datagrid('appendRow',{
      name        : 'book title',
      author      : 'book\'s author',
      published   : 'Jan 1 2001',
      category    : 'book category',
    });
    lastIndex = tbl.datagrid('getRows').length - 1;
    if (lastIndex < 0)
      lastIndex = 0;
    tbl.datagrid('selectRow', lastIndex);
    tbl.datagrid('beginEdit', lastIndex);
    update_icon_swap('done');
    lastAdd = 1;
  });
  $('#btn_upd').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    update_icon_swap('edit');
    var row = tbl.datagrid('getSelected');
    if (row) {
      var this_index = tbl.datagrid('getRowIndex', row);
      if (this_index >= 0) {
        if (lastEdit || lastAdd) {
          tbl.datagrid('endEdit', this_index);
          lastEdit = 0;
          lastAdd = 0;
          update_icon_swap('edit');
        } else {
          lastIndex = tbl.datagrid('getRowIndex', row);
          if (lastIndex < 0)
            lastIndex = 0;
          tbl.datagrid('beginEdit', lastIndex);
          lastEdit = 1;
          update_icon_swap('done');
        }
      }
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
          update_icon_swap('edit');
        }
      });
    }
  });
  $('#btn_cancel').click(function(){
    $.messager.confirm('Confirm','Are you sure you want to discard changes?', function(r){
      if (r) {
        tbl.datagrid('rejectChanges');
        update_icon_swap('edit');
      }
    });
  });
  $('#btn_save').click(function(){
    update_icon_swap('edit');
    var add_records = tbl.datagrid('getChanges', 'inserted');
    var upd_records = tbl.datagrid('getChanges', 'updated');
    var del_records = tbl.datagrid('getChanges', 'deleted');
    tbl.datagrid('acceptChanges');
    $.each(add_records, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'POST',
        'data': {
          'name'       : row.name,
          'author'     : row.author,
          'published'  : row.published,
          'category'   : row.category,
        },
        success: function(response) {
          bid = response.book_id;
          grd = tbl.datagrid('getRows');
          idx = tbl.datagrid('getRowIndex', row);
          grd[idx].id = bid;
          tbl.datagrid('updateRow',{ index: idx, row: {} });
        },
        error: function(response) {
          popup('err', true)
        }
      });
    });
    $.each(upd_records, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'PUT',
        'data': {
          'id'         : row.id,
          'name'       : row.name,
          'author'     : row.author,
          'published'  : row.published,
          'category'   : row.category
        },
        error: function(response) {
          popup('err', true)
        }
      });
    });
    $.each(del_records, function(i, row) {
      $.ajax('/api/notes/' + row.id, {'type':'DELETE'});
    });
  });
});
function popup(text, err) {
  if (err) {
    $.messager.alert('Error!','Data transport error!','error');
  } else {
    $.messager.show({
      title:    'Success',
      msg:      text,
      timeout:  3000,
      showType: 'slide'
    });
  }
}
function update_icon_swap(e) {
  lb = $('#btn_upd').linkbutton();
  if (!e) {
    if (lb.data().linkbutton.options.iconCls == 'icon-ok')
      lb.data().linkbutton.options.iconCls = 'icon-edit';
    else
      lb.data().linkbutton.options.iconCls = 'icon-ok';
  }
  else if (e == 'edit'){
    lb.data().linkbutton.options.iconCls = 'icon-edit';
  }
  else if (e == 'done'){
    lb.data().linkbutton.options.iconCls = 'icon-ok';
  }
  $('#btn_upd').linkbutton();
}
$(window).resize(function(){
  var height = $(window).height();
  $('#tt').datagrid('resize', { height: height-30 } )
});

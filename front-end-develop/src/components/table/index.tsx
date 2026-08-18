import { Input, InputGroup, Table as LibTable, Pagination } from "rsuite";
import React, { useContext, useEffect, useState } from "react";
import { TableType } from "@/types/Table";
import "./styles.css";
import useScreenSize from "@/hooks/useScreenSize";
import { LanguageContext } from "@/context/LanguageContext";
import Icon from "../icon";
import toastMessage from "@/utils/common/toastMessage";

const Table: React.FC<TableType> = ({
  data,
  children,
  bordered,
  cellBordered,
  handleRowClick,
  handleSortClick,
  loading,
  sortType,
  sortColumn,
  limit,
  page,
  setPage,
  handleChangeLimit,
  totalPages,
  paginationLayout,
  rowKey,
  expandedRowKeys,
  renderRowExpanded,
  rowExpandedHeight = 100,
  onSearch,
  searchPlaceholder,
}) => {
  const { isPhone, isTablet } = useScreenSize();
  const { translation } = useContext(LanguageContext);
  const [searchText, setSearch] = useState("");

  return (
    <div style={{ width: "100%" }} className="card">
      {onSearch && (
        <div className="card-body">
          <div className="row">
            {onSearch && (
              <div className="col-md-4" title={searchPlaceholder}>
                <InputGroup>
                  <Input
                    placeholder={
                      searchPlaceholder
                        ? searchPlaceholder
                        : `${translation.search}...`
                    }
                    value={searchText?.toUpperCase()}
                    onChange={setSearch}
                    // className="uppercase-input border-primary"
                  />
                  <InputGroup.Button
                    className="bg-primary"
                    onClick={() =>
                      onSearch
                        ? onSearch(searchText)
                        : toastMessage("error", "MISSING-SEARCH-FUNC")
                    }
                  >
                    <Icon name="search" />
                  </InputGroup.Button>
                </InputGroup>
              </div>
            )}
          </div>
        </div>
      )}

      <LibTable
        virtualized
        autoHeight
        data={data}
        onRowClick={(rowData) =>
          handleRowClick ? handleRowClick(rowData) : null
        }
        bordered={bordered}
        cellBordered={cellBordered}
        rowHeight={50}
        onSortColumn={(sortColumn, sortType) =>
          handleSortClick ? handleSortClick({ sortColumn, sortType }) : null
        }
        affixHorizontalScrollbar
        sortColumn={sortColumn}
        sortType={sortType}
        loading={loading}
        className="full-width"
        rowKey={rowKey}
        expandedRowKeys={expandedRowKeys}
        renderRowExpanded={renderRowExpanded}
        rowExpandedHeight={rowExpandedHeight || 200}
      >
        {children}
      </LibTable>

      {totalPages !== undefined && totalPages > 0 && (
        <div className="card-footer">
          <div style={{ padding: "20px 0" }}>
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
              size="xs"
              layout={
                paginationLayout || isPhone || isTablet
                  ? ["total", "-", "pager"]
                  : ["total", "-", "limit", "|", "pager"]
              }
              total={totalPages || 0}
              limitOptions={[10, 50, 100, 500]}
              limit={limit}
              activePage={page}
              onChangePage={setPage}
              onChangeLimit={handleChangeLimit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;

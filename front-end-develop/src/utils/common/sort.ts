export const onSort = ({
  data,
  sortColumn,
  sortType,
}: {
  sortType?: string | number;
  sortColumn?: string | number;
  data: any[];
}) => {
  if (sortColumn && sortType) {
    return [...data].sort((a, b) => {
      let x: string | number = a[sortColumn];
      let y: string | number = b[sortColumn];

      if (typeof x === "string") {
        x = x.charCodeAt(0);
      }
      if (typeof y === "string") {
        y = y.charCodeAt(0);
      }
      if (sortType === "asc") {
        return x - y;
      } else {
        return y - x;
      }
    });
  }
  return data;
};

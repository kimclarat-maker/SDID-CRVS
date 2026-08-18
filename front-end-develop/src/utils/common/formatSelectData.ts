export default (data: any, key_label?: string, key_value?: string) => {
  let result;

  if (Array.isArray(data)) {
    result = [];

    for (let i = 0; i < data.length; i++) {
      let extra_data = data[i];

      result.push({
        ...extra_data,
        value: key_value ? data[i][key_value] : data[i],
        label: key_label ? data[i][key_label] : data[i],
      });
    }
  } else {
    let extra_data = data;
    result = {
      ...extra_data,
      value: key_value ? data[key_value] : data,
      label: key_label ? data[key_label] : data,
    };
  }

  return result;
};

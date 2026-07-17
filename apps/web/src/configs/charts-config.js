export const chartsConfig = {
  chart: {
    toolbar: {
      show: false,
    },
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    show: "",
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    axisTicks: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
    labels: {
      style: {
        colors: "#64748B",
        fontSize: "12px",
        fontFamily: "inherit",
        fontWeight: 400,
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "#64748B",
        fontSize: "12px",
        fontFamily: "inherit",
        fontWeight: 400,
      },
    },
  },
  grid: {
    show: true,
    borderColor: "#E9EEF5",
    strokeDashArray: 0,
    xaxis: {
      lines: {
        show: false,
      },
    },
    padding: {
      top: 5,
      right: 20,
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    theme: "dark",
  },
};

export default chartsConfig;

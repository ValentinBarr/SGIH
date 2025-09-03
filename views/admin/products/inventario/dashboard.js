//Dashboard con metricas
const layout = require('../layout'); // tu layout general

module.exports = ({ products }) => {
  return layout({
    content: `
    <div> Aqui va el dashboard </div>
    `
  });
};
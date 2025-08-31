const layout = require('./layout'); // tu layout general

module.exports = ({ products }) => {
  return layout({
    content: `
    <div> Contenido html pos </div>
    `
  });
};

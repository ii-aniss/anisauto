'use strict';

const { handleApiRequest } = require('../server/index');

module.exports = async (req, res) => handleApiRequest(req, res);

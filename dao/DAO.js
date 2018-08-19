function findOne({ baseQuery, selectQuery, populateQuery, sortQuery, skipQuery }) {
    if (!baseQuery) throw new Error('Base Query does not exist');
    return this.Model
        .findOne(baseQuery)
        .select(selectQuery || {})
        .sort(sortQuery || {})
        .skip(Number(skipQuery) || 0)
        .populate(populateQuery || '')
        .exec();
}

function findById({ id, projectionQuery = {}, populateQuery }) {
    return this.Model.findById(id, projectionQuery)
        .populate(populateQuery || '')
        .exec();
}

function findByIdAndUpdate(id, updateObj) {
    return this.Model.findByIdAndUpdate(id, updateObj, { new: true }).exec();
}

function findOneAndUpdate(filter, update, options) {
    return this.Model.findOneAndUpdate(filter, update, options).exec();
}

function save(doc) {
    // doc.client = this.clientId;
    const document = new this.Model(doc);
    return document.save();
}

function find({ baseQuery, selectQuery, populateQuery, limitQuery, sortQuery, skipQuery }) {
    if (!baseQuery) throw new Error('Base Query does not exist');
    return this.Model
        .find(baseQuery)
        .select(selectQuery || {})
        .sort(sortQuery)
        .skip(Number(skipQuery) || 0)
        .limit(Number(limitQuery) || 0)
        .populate(populateQuery || '')
        .exec();
}

function findByPagination({ baseQuery, totalCountQuery, populateQuery }, filter) {
    if (!baseQuery) throw new Error('Base Query does not exist');
    return this.Model
        .find(baseQuery)
        .select(filter.select)
        .sort(filter.sort)
        .skip(filter.skip)
        .limit(filter.limit)
        .populate(populateQuery || '')
        .exec()
        .then((response) => {
            return Promise.all([this.Model.count(totalCountQuery), this.Model.count(baseQuery)])
                .then((count) => {
                    const recordsTotal = count[0];
                    const recordsFiltered = count[1];
                    const draw = filter.draw;
                    return { recordsTotal, recordsFiltered, draw, response };
                });
        });
}

function update(query, updateObject, options) {
    return this.Model.update(query, updateObject, options).exec();
}

function count(query) {
    return this.Model.count(query).exec();
}

function remove(query) {
    return this.Model.remove(query);
}

function findOneAndRemove(query) {
    return this.Model.findOneAndRemove(query);
}

function findByIdAndRemove(id) {
    return this.Model.findByIdAndRemove(id);
}

function getModel() {
    return this.Model;
}

function batchInsert(batch, options) {
    return this.Model.collection.insert(batch, options);
}

function aggregate({ queryPipe, model }) {
    return new Promise((resolve, reject) => {
        (this.Model || model).collection.aggregate(queryPipe, (err, response) => {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

function aggregateByPagination({ queryPipe, totalQueryPipe }) {
    const queryPromises = [];
    const mainAggregateQuery = aggregate({ queryPipe, model: this.Model });
    queryPromises.push(mainAggregateQuery);
    queryPromises.push(queryPromises.push(new Promise((resolve, reject) => {
        this.Model.collection.aggregate(totalQueryPipe, (err, response) => {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    })));

    return Promise.all(queryPromises).then((result) => {
        const recordsTotal = (result[1][0] || {}).total || 0;
        const recordsFiltered = (result[1][0] || {}).total || 0;
        const response = result[0];
        return { recordsTotal, recordsFiltered, response };
    });
}


function DAO() {}

DAO.prototype = {
    find,
    findById,
    findByIdAndUpdate,
    findByIdAndRemove,
    findOneAndUpdate,
    findByPagination,
    findOne,
    findOneAndRemove,
    remove,
    update,
    count,
    save,
    getModel,
    batchInsert,
    aggregate,
    aggregateByPagination,
};

module.exports = DAO;
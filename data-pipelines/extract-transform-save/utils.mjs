
export const get = (obj, path) => {
    let toReturnObjOrVal = obj;
    for (let edge of path) {
        toReturnObjOrVal = obj[edge];
        if (!toReturnObjOrVal) {
            return;
        }
        obj = toReturnObjOrVal;
    };
    return toReturnObjOrVal;
}

export const set = (obj, path, val) => {
    let toUpdateObj = obj;
    for (let i = 0; i < path.length - 1; i++) { //iterate over all edges except last
        let edge = path[i];
        toUpdateObj = obj[edge] || (obj[edge] = {});
        obj = toUpdateObj;
    };
    toUpdateObj[path[path.length - 1]] = val;
}

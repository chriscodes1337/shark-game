function getSquareDistance(p1, p2, q1, q2) {
    return (q1 - p1) * (q1 - p1) + (q2 - p2) * (q2 - p2)
}

//From tutorial by Dr. Radu Mariescu-Istodor/freecodecamp (https://www.youtube.com/watch?v=Rs_rAxEsAvI):

function lerp(A, B, t) {
    return A + (B - A) * t;
}

function getIntersection(A, B, C, D) {
    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
    const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

    if (bottom != 0) {
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: lerp(A.x, B.x, t),
                y: lerp(A.y, B.y, t),
                offset: t
            }
        }
    }
    return {
        x: lerp(A.x, B.x, 1),
        y: lerp(A.y, B.y, 1),
        offset: 1
    }
}

//Calculate new unit vector
//Rotate it counter-clockwise
function rotateUnitVector(v, angle) {
    const resultX = v.x * Math.cos(angle) - v.y * Math.sin(angle);
    //console.log("resultX", resultX);
    const resultY = v.x * Math.sin(angle) + v.y * Math.cos(angle);
    //console.log("resultY", resultY);
    const result = {x: resultX, y: resultY};
    return result;
}
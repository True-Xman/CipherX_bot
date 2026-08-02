"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserState = void 0;
/**
 * Finite state machine for user verification flow.
 * UNVERIFIED -> (captcha shown) -> IN_CAPTCHA -> SELECT_LANG -> READY
 * BANNED is a terminal state until ban expiry is reached.
 */
var UserState;
(function (UserState) {
    UserState["UNVERIFIED"] = "UNVERIFIED";
    UserState["IN_CAPTCHA"] = "IN_CAPTCHA";
    UserState["SELECT_LANG"] = "SELECT_LANG";
    UserState["READY"] = "READY";
    UserState["BANNED"] = "BANNED";
})(UserState || (exports.UserState = UserState = {}));
//# sourceMappingURL=index.js.map
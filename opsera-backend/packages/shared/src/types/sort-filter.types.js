"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterRequest = exports.SortRequest = exports.FilterOperator = exports.SortDirection = void 0;
const class_validator_1 = require("class-validator");
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "ASC";
    SortDirection["DESC"] = "DESC";
})(SortDirection || (exports.SortDirection = SortDirection = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQ"] = "EQ";
    FilterOperator["NEQ"] = "NEQ";
    FilterOperator["GT"] = "GT";
    FilterOperator["GTE"] = "GTE";
    FilterOperator["LT"] = "LT";
    FilterOperator["LTE"] = "LTE";
    FilterOperator["IN"] = "IN";
    FilterOperator["CONTAINS"] = "CONTAINS";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
class SortRequest {
    field;
    direction;
}
exports.SortRequest = SortRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SortRequest.prototype, "field", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SortDirection),
    __metadata("design:type", String)
], SortRequest.prototype, "direction", void 0);
class FilterRequest {
    field;
    operator;
    value;
}
exports.FilterRequest = FilterRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterRequest.prototype, "field", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FilterOperator),
    __metadata("design:type", String)
], FilterRequest.prototype, "operator", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], FilterRequest.prototype, "value", void 0);
//# sourceMappingURL=sort-filter.types.js.map
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
exports.TriggerRiskAnalysisDto = exports.RiskFindingDto = exports.RiskDimension = exports.RiskRecommendation = exports.RiskLevel = void 0;
const class_validator_1 = require("class-validator");
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["CRITICAL"] = "CRITICAL";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["LOW"] = "LOW";
    RiskLevel["NONE"] = "NONE";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var RiskRecommendation;
(function (RiskRecommendation) {
    RiskRecommendation["GO"] = "GO";
    RiskRecommendation["NO_GO"] = "NO_GO";
    RiskRecommendation["GO_WITH_CONDITIONS"] = "GO_WITH_CONDITIONS";
})(RiskRecommendation || (exports.RiskRecommendation = RiskRecommendation = {}));
var RiskDimension;
(function (RiskDimension) {
    RiskDimension["CODE_CHANGE"] = "CODE_CHANGE";
    RiskDimension["DEPLOYMENT_FREQUENCY"] = "DEPLOYMENT_FREQUENCY";
    RiskDimension["POLICY_COMPLIANCE"] = "POLICY_COMPLIANCE";
    RiskDimension["ENVIRONMENT_HEALTH"] = "ENVIRONMENT_HEALTH";
    RiskDimension["CHANGE_BLAST_RADIUS"] = "CHANGE_BLAST_RADIUS";
})(RiskDimension || (exports.RiskDimension = RiskDimension = {}));
/** A single risk finding from a scoring dimension evaluator. */
class RiskFindingDto {
    dimension;
    severity;
    description;
    evidence;
}
exports.RiskFindingDto = RiskFindingDto;
__decorate([
    (0, class_validator_1.IsEnum)(RiskDimension),
    __metadata("design:type", String)
], RiskFindingDto.prototype, "dimension", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(RiskLevel),
    __metadata("design:type", String)
], RiskFindingDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RiskFindingDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RiskFindingDto.prototype, "evidence", void 0);
/** Request to trigger a risk analysis. */
class TriggerRiskAnalysisDto {
    releaseId;
    riskThreshold;
}
exports.TriggerRiskAnalysisDto = TriggerRiskAnalysisDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TriggerRiskAnalysisDto.prototype, "releaseId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], TriggerRiskAnalysisDto.prototype, "riskThreshold", void 0);
//# sourceMappingURL=risk.dto.js.map
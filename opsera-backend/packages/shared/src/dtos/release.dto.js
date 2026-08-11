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
exports.UpdateReleaseDto = exports.CreateReleaseDto = exports.TargetEnvironment = exports.ReleaseStatus = void 0;
const class_validator_1 = require("class-validator");
var ReleaseStatus;
(function (ReleaseStatus) {
    ReleaseStatus["PENDING"] = "PENDING";
    ReleaseStatus["ANALYSIS_IN_PROGRESS"] = "ANALYSIS_IN_PROGRESS";
    ReleaseStatus["ANALYSIS_COMPLETE"] = "ANALYSIS_COMPLETE";
    ReleaseStatus["APPROVED"] = "APPROVED";
    ReleaseStatus["REJECTED"] = "REJECTED";
    ReleaseStatus["DEPLOYING"] = "DEPLOYING";
    ReleaseStatus["DEPLOYED"] = "DEPLOYED";
    ReleaseStatus["FAILED"] = "FAILED";
    ReleaseStatus["ROLLED_BACK"] = "ROLLED_BACK";
})(ReleaseStatus || (exports.ReleaseStatus = ReleaseStatus = {}));
var TargetEnvironment;
(function (TargetEnvironment) {
    TargetEnvironment["DEVELOPMENT"] = "DEVELOPMENT";
    TargetEnvironment["STAGING"] = "STAGING";
    TargetEnvironment["PRODUCTION"] = "PRODUCTION";
})(TargetEnvironment || (exports.TargetEnvironment = TargetEnvironment = {}));
/** Request DTO to create a new release. */
class CreateReleaseDto {
    name;
    description;
    targetEnvironmentId;
    changeRefs;
    jiraTicket;
}
exports.CreateReleaseDto = CreateReleaseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(500),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "targetEnvironmentId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateReleaseDto.prototype, "changeRefs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "jiraTicket", void 0);
/** Partial update request. */
class UpdateReleaseDto {
    name;
    description;
    status;
}
exports.UpdateReleaseDto = UpdateReleaseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateReleaseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateReleaseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReleaseStatus),
    __metadata("design:type", String)
], UpdateReleaseDto.prototype, "status", void 0);
//# sourceMappingURL=release.dto.js.map
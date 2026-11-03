import {
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 25

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset = 0
}
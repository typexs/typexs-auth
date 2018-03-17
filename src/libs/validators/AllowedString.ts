import {registerDecorator, ValidationArguments, ValidationOptions} from "class-validator";

/*
@ValidatorConstraint({ async: true })
export class AllowedCharsConstraint implements ValidatorConstraintInterface {

  validate(str: any, args: ValidationArguments) {
  }

}
*/

export function AllowedString(regex:RegExp, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name:"allowedString",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any, args: ValidationArguments) {
          return regex.test(value);
        }
      }
    });
  };
}

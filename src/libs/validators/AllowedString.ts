import {registerDecorator, ValidationArguments, ValidationOptions} from 'class-validator';

/*
@ValidatorConstraint({ async: true })
export class AllowedCharsConstraint implements ValidatorConstraintInterface {

  validate(str: any, args: ValidationArguments) {
  }

}
*/

export function AllowedString(regex: string | RegExp, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'allowedString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (regex instanceof RegExp) {
            return regex.test(value);
          }
          return new RegExp(regex).test(value);
        }
      }
    });
  };
}

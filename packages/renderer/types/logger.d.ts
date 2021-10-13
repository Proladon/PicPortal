export interface Logger {
  title: CallableFunction
  danger: CallableFunction
  success: CallableFunction
  todo: CallableFunction
  action: CallableFunction
  noLabel: CallableFunction
  dot: CallableFunction
  info: CallableFunction
}
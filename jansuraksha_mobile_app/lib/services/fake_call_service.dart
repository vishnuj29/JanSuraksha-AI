class FakeCallConfig {
  final String callerName;
  final String callerNumber;
  final String avatarUrl;
  final int delaySeconds;

  FakeCallConfig({
    this.callerName = 'Mom',
    this.callerNumber = '+91 98765 43210',
    this.avatarUrl = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    this.delaySeconds = 3,
  });
}

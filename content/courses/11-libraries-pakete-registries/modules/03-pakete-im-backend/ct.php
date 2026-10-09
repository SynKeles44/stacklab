<?php function assert_same($a,$b){ if($a!==$b){echo 'FAIL ', var_export($a,true),' vs ',var_export($b,true),"\n";} else echo "ok\n"; } function assert_true($x){assert_same(true,$x);}


final class Container
{
    private static array $bindings = [];

    public static function bind(string $key, callable $factory): void
    {
        self::$bindings[$key] = $factory;
    }

    public static function make(string $key): object
    {
        if (!isset(self::$bindings[$key])) {
            throw new RuntimeException("Nichts gebunden unter {$key}");
        }

        return (self::$bindings[$key])();
    }
}

final class Greeter
{
    public function hello(string $name): string
    {
        return "Hallo, {$name}";
    }
}

abstract class Facade
{
    abstract protected static function accessor(): string;

    public static function __callStatic(string $method, array $arguments): mixed
    {
        return Container::make(static::accessor())->$method(...$arguments);
    }
}

final class Greet extends Facade
{
    protected static function accessor(): string
    {
        return 'greeter';
    }
}
(function(){ Container::bind('greeter', fn () => new Greeter());
assert_same('Hallo, Ada', Greet::hello('Ada'));
 })();
(function(){ Container::bind('greeter', fn () => new class {
    public function hello(string $name): string { return "Fake {$name}"; }
});
assert_same('Fake Ada', Greet::hello('Ada'));
 })();
(function(){ $fehler = false;
try {
    Container::make('unbekannt');
} catch (RuntimeException $e) {
    $fehler = true;
}
assert_true($fehler);
 })();

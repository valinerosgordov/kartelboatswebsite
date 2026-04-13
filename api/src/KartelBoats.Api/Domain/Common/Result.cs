using System.Diagnostics.CodeAnalysis;

namespace KartelBoats.Api.Domain.Common;

[SuppressMessage("Naming", "CA1716:Identifiers should not match keywords")]
public sealed record AppError(string Code, string Description)
{
    public static readonly AppError None = new(string.Empty, string.Empty);
    public static readonly AppError NotFound = new("General.NotFound", "Resource not found.");
    public static readonly AppError Validation = new("General.Validation", "A validation error occurred.");
    public static readonly AppError ExternalService = new("General.ExternalService", "External service request failed.");
}

[SuppressMessage("Design", "CA1000:Do not declare static members on generic types")]
public sealed class Result<TValue>
{
    private readonly TValue? _value;

    private Result(TValue value)
    {
        _value = value;
        IsSuccess = true;
        Error = AppError.None;
    }

    private Result(AppError error)
    {
        _value = default;
        IsSuccess = false;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public AppError Error { get; }

    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access value of a failed result.");

    public static Result<TValue> Success(TValue value) => new(value);
    public static Result<TValue> Failure(AppError error) => new(error);

    public static implicit operator Result<TValue>(TValue value) => Success(value);
    public static implicit operator Result<TValue>(AppError error) => Failure(error);

    public TResult Match<TResult>(
        Func<TValue, TResult> onSuccess,
        Func<AppError, TResult> onFailure) =>
        IsSuccess ? onSuccess(_value!) : onFailure(Error);
}

public sealed class Result
{
    private Result(bool isSuccess, AppError error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public AppError Error { get; }

    public static Result Success() => new(true, AppError.None);
    public static Result Failure(AppError error) => new(false, error);

    public static implicit operator Result(AppError error) => Failure(error);
}
